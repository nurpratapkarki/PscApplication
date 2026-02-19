const DEFAULT_API_BASE_URL = "http://localhost:8000";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export const API_ENDPOINTS = {
	auth: {
	  user: "/api/auth/user/",
	  login: "/api/auth/login/",
	  logout: "/api/auth/logout/",
	  registration: "/api/auth/registration/",
	  googleLogin: "/api/auth/google/",
	  tokenObtainPair: "/token/",
	  tokenRefresh: "/token/refresh/",
	  tokenBlacklist: "/token/blacklist/",
	  passwordChange: "/api/auth/password/change/",
	  forgotPassword: "/api/auth/forgot-password/",
	  verifyOtp: "/api/auth/verify-otp/",
	  resetPassword: "/api/auth/reset-password/",
	},
	branches: {
	  list: "/api/branches/",
	  detail: (id: number | string) => `/api/branches/${id}/`,
	  subBranches: "/api/sub-branches/",
	  subBranchDetail: (id: number | string) => `/api/sub-branches/${id}/`,
	  categories: "/api/categories/",
	  categoryDetail: (id: number | string) => `/api/categories/${id}/`,
	  categoriesForUser: "/api/categories/for-user/",
	  categoriesForBranch: "/api/categories/for-branch/",
	},
	questions: {
	  list: "/api/questions/",
	  detail: (id: number | string) => `/api/questions/${id}/`,
	  bulkUpload: "/api/questions/bulk-upload/",
	  reports: "/api/reports/",
	  reportDetail: (id: number | string) => `/api/reports/${id}/`,
	},
	mockTests: {
	  list: "/api/mock-tests/",
	  detail: (id: number | string) => `/api/mock-tests/${id}/`,
	  generate: "/api/mock-tests/generate/",
	},
	attempts: {
	  list: "/api/attempts/",
	  start: "/api/attempts/start/",
	  myAttempts: "/api/attempts/",
	  detail: (id: number | string) => `/api/attempts/${id}/`,
	  submit: (id: number | string) => `/api/attempts/${id}/submit/`,
	  results: (id: number | string) => `/api/attempts/${id}/results/`,
	},
	answers: {
	  list: "/api/answers/",
	  detail: (id: number | string) => `/api/answers/${id}/`,
	  bulk: "/api/answers/bulk/",
	},
	analytics: {
	  contributions: "/api/contributions/",
	  myContributions: "/api/contributions/",
	  dailyActivity: "/api/daily-activity/",
	},
	stats: {
	  platform: "/api/platform-stats/",
	  statistics: "/api/statistics/",
	  statisticsMe: "/api/statistics/me/",
	  progress: "/api/progress/",
	  collections: "/api/collections/",
	  collectionDetail: (id: number | string) => `/api/collections/${id}/`,
	  leaderboard: "/api/leaderboard/",
	  rankings: "/api/rankings/",
	},
	notifications: {
	  list: "/api/notifications/",
	  detail: (id: number | string) => `/api/notifications/${id}/`,
	  markRead: (id: number | string) => `/api/notifications/${id}/read/`,
	  markAllRead: "/api/notifications/read-all/",
	  unreadCount: "/api/notifications/unread/",
	  registerPushToken: "/api/notifications/register-push-token/",
	  unregisterPushToken: "/api/notifications/unregister-push-token/",
	},
	settings: {
	  list: "/api/settings/",
	  detail: (key: string) => `/api/settings/${encodeURIComponent(key)}/`,
	},
	timeConfigs: {
	  list: "/api/time-configs/",
	},
	} as const;

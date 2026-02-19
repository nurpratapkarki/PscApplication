// Professional Color Palette for PSC Exam Prep App
// Inspired by modern educational apps with Nepal-themed accents

export const Colors = {
  // Primary Brand Colors
  primary: '#1E3A5F',      // Deep Navy Blue - Trust & Education
  primaryLight: '#2E5A8F', // Lighter Navy
  primaryDark: '#0F2440',  // Darker Navy
  
  // Secondary Accent Colors
  secondary: '#E63946',    // Vibrant Red - Energy & Action (Nepal flag inspired)
  secondaryLight: '#FF6B6B',
  secondaryDark: '#C62828',
  
  // Accent Colors
  accent: '#2A9D8F',       // Teal Green - Success & Growth
  accentLight: '#4ECDC4',
  accentDark: '#1A7A6E',
  
  // Semantic Colors
  success: '#10B981',      // Green
  successLight: '#D1FAE5',
  warning: '#F59E0B',      // Amber
  warningLight: '#FEF3C7',
  error: '#EF4444',        // Red
  errorLight: '#FEE2E2',
  info: '#3B82F6',         // Blue
  infoLight: '#DBEAFE',
  
  // Neutral Colors
  white: '#FFFFFF',
  background: '#F8FAFC',   // Light Gray Background
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  
  // Text Colors
  textPrimary: '#1E293B',  // Dark Slate
  textSecondary: '#64748B', // Medium Gray
  textTertiary: '#94A3B8', // Light Gray
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  
  // Border Colors
  border: '#E2E8F0',
  borderDark: '#CBD5E1',
  
  // Card & Elevation
  cardBackground: '#FFFFFF',
  cardBorder: '#E2E8F0',
  shadow: 'rgba(0, 0, 0, 0.08)',
  
  // Status Colors for Tests/Questions
  correct: '#10B981',
  incorrect: '#EF4444',
  skipped: '#F59E0B',
  unanswered: '#94A3B8',
  
  // Badge Colors
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  
  // Difficulty Levels
  difficultyEasy: '#10B981',
  difficultyMedium: '#F59E0B',
  difficultyHard: '#EF4444',
  
  // Gradient Definitions (for use with LinearGradient)
  gradientPrimary: ['#1E3A5F', '#2E5A8F'],
  gradientAccent: ['#2A9D8F', '#4ECDC4'],
  gradientSuccess: ['#10B981', '#34D399'],
  gradientWarning: ['#F59E0B', '#FBBF24'],
  gradientDanger: ['#EF4444', '#F87171'],
} as const;

// Dark Theme Colors
export const DarkColors = {
  ...Colors,
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',
  border: '#334155',
  borderDark: '#475569',
  cardBackground: '#1E293B',
  cardBorder: '#334155',
} as const;

// Use a mapped type so DarkColors overrides are assignable
export type ColorScheme = {
  [K in keyof typeof Colors]: (typeof Colors)[K] extends readonly string[]
    ? readonly string[]
    : string;
};


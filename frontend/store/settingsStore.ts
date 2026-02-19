import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandMMKVStorage } from '../services/storage';
import type { LanguagePreference } from '../types/user.types';

type NotificationFrequency = 'all' | 'important' | 'none';

interface SettingsState {
  // State
  language: LanguagePreference;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';

  // Notification preferences (local-only)
  streakReminders: boolean;
  testReminders: boolean;
  contributionUpdates: boolean;
  leaderboardUpdates: boolean;
  notificationFrequency: NotificationFrequency;

  // Study preferences (local-only)
  autoAdvance: boolean;
  showExplanations: boolean;
  shuffleQuestions: boolean;

  // Actions
  setLanguage: (language: LanguagePreference) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setStreakReminders: (enabled: boolean) => void;
  setTestReminders: (enabled: boolean) => void;
  setContributionUpdates: (enabled: boolean) => void;
  setLeaderboardUpdates: (enabled: boolean) => void;
  setNotificationFrequency: (frequency: NotificationFrequency) => void;
  setAutoAdvance: (enabled: boolean) => void;
  setShowExplanations: (enabled: boolean) => void;
  setShuffleQuestions: (enabled: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  language: 'EN' as LanguagePreference,
  notificationsEnabled: true,
  soundEnabled: true,
  darkMode: false,
  fontSize: 'medium' as const,
  streakReminders: true,
  testReminders: true,
  contributionUpdates: true,
  leaderboardUpdates: false,
  notificationFrequency: 'important' as NotificationFrequency,
  autoAdvance: true,
  showExplanations: true,
  shuffleQuestions: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      ...defaultSettings,

      // Actions
      setLanguage: (language: LanguagePreference) => {
        set({ language });
      },

      setNotificationsEnabled: (enabled: boolean) => {
        set({ notificationsEnabled: enabled });
      },

      setSoundEnabled: (enabled: boolean) => {
        set({ soundEnabled: enabled });
      },

      setDarkMode: (enabled: boolean) => {
        set({ darkMode: enabled });
      },

      setFontSize: (size: 'small' | 'medium' | 'large') => {
        set({ fontSize: size });
      },

      setStreakReminders: (enabled: boolean) => {
        set({ streakReminders: enabled });
      },

      setTestReminders: (enabled: boolean) => {
        set({ testReminders: enabled });
      },

      setContributionUpdates: (enabled: boolean) => {
        set({ contributionUpdates: enabled });
      },

      setLeaderboardUpdates: (enabled: boolean) => {
        set({ leaderboardUpdates: enabled });
      },

      setNotificationFrequency: (frequency: NotificationFrequency) => {
        set({ notificationFrequency: frequency });
      },

      setAutoAdvance: (enabled: boolean) => {
        set({ autoAdvance: enabled });
      },

      setShowExplanations: (enabled: boolean) => {
        set({ showExplanations: enabled });
      },

      setShuffleQuestions: (enabled: boolean) => {
        set({ shuffleQuestions: enabled });
      },

      resetSettings: () => {
        set(defaultSettings);
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);

// Selectors
export const selectLanguage = (state: SettingsState) => state.language;
export const selectNotificationsEnabled = (state: SettingsState) => state.notificationsEnabled;
export const selectSoundEnabled = (state: SettingsState) => state.soundEnabled;
export const selectDarkMode = (state: SettingsState) => state.darkMode;
export const selectFontSize = (state: SettingsState) => state.fontSize;

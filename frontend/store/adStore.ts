import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '../services/storage';

interface AdState {
  practiceSessionCount: number;
  isPremium: boolean;
  incrementPracticeCount: () => void;
  setPremium: (value: boolean) => void;
  resetPracticeCount: () => void;
}

export const useAdStore = create<AdState>()(
  persist(
    (set) => ({
      practiceSessionCount: 0,
      isPremium: false,
      incrementPracticeCount: () =>
        set((s) => ({ practiceSessionCount: s.practiceSessionCount + 1 })),
      setPremium: (value) => set({ isPremium: value }),
      resetPracticeCount: () => set({ practiceSessionCount: 0 }),
    }),
    {
      name: 'psc-ad-store',
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({
        practiceSessionCount: state.practiceSessionCount,
        isPremium: state.isPremium,
      }),
    }
  )
);
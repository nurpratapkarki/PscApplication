import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '../services/storage';

interface AdState {
  practiceSessionCount: number;
  isPremium: boolean;
  downloadedNoteIds: number[];
  lastNoteViewAdDate: string | null;
  incrementPracticeCount: () => void;
  setPremium: (value: boolean) => void;
  resetPracticeCount: () => void;
  markNoteDownloaded: (noteId: number) => void;
  isNoteDownloaded: (noteId: number) => boolean;
  setLastNoteViewAdDate: (date: string) => void;
}

export const useAdStore = create<AdState>()(
  persist(
    (set) => ({
      practiceSessionCount: 0,
      isPremium: false,
      downloadedNoteIds: [],
      lastNoteViewAdDate: null,
      incrementPracticeCount: () =>
        set((s) => ({ practiceSessionCount: s.practiceSessionCount + 1 })),
      setPremium: (value) => set({ isPremium: value }),
      resetPracticeCount: () => set({ practiceSessionCount: 0 }),
      markNoteDownloaded: (noteId) =>
        set((s) => {
          if (s.downloadedNoteIds.includes(noteId)) return s;
          return { downloadedNoteIds: [...s.downloadedNoteIds, noteId] };
        }),
      isNoteDownloaded: (noteId) =>
        useAdStore.getState().downloadedNoteIds.includes(noteId),
      setLastNoteViewAdDate: (date) => set({ lastNoteViewAdDate: date }),
    }),
    {
      name: 'psc-ad-store',
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({
        practiceSessionCount: state.practiceSessionCount,
        isPremium: state.isPremium,
        downloadedNoteIds: state.downloadedNoteIds,
        lastNoteViewAdDate: state.lastNoteViewAdDate,
      }),
    }
  )
);

import { create } from 'zustand';
import type { Question } from '../types/question.types';

interface PracticeAnswer {
  questionId: number;
  selectedOption: string | null;
  isCorrect: boolean | null;
  timeTaken: number;
}

interface PracticeSession {
  categoryId: number;
  categoryName: string;
  questions: Question[];
  answers: Record<number, PracticeAnswer>;
  currentIndex: number;
  startTime: number;
  endTime: number | null;
  isCompleted: boolean;
}

interface PracticeState {
  // State
  session: PracticeSession | null;
  
  // Actions
  startSession: (categoryId: number, categoryName: string, questions: Question[]) => void;
  answerQuestion: (questionId: number, selectedOption: string, isCorrect: boolean, timeTaken: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  completeSession: () => void;
  clearSession: () => void;
  
  // Computed
  getCurrentQuestion: () => Question | null;
  getProgress: () => { answered: number; total: number; correct: number };
  getResults: () => { score: number; accuracy: number; totalTime: number; answers: PracticeAnswer[] } | null;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  session: null,

  startSession: (categoryId: number, categoryName: string, questions: Question[]) => {
    set({
      session: {
        categoryId,
        categoryName,
        questions,
        answers: {},
        currentIndex: 0,
        startTime: Date.now(),
        endTime: null,
        isCompleted: false,
      },
    });
  },

  answerQuestion: (questionId: number, selectedOption: string, isCorrect: boolean, timeTaken: number) => {
    const { session } = get();
    if (!session) return;

    set({
      session: {
        ...session,
        answers: {
          ...session.answers,
          [questionId]: {
            questionId,
            selectedOption,
            isCorrect,
            timeTaken,
          },
        },
      },
    });
  },

  nextQuestion: () => {
    const { session } = get();
    if (!session) return;
    if (session.currentIndex < session.questions.length - 1) {
      set({
        session: {
          ...session,
          currentIndex: session.currentIndex + 1,
        },
      });
    }
  },

  prevQuestion: () => {
    const { session } = get();
    if (!session) return;
    if (session.currentIndex > 0) {
      set({
        session: {
          ...session,
          currentIndex: session.currentIndex - 1,
        },
      });
    }
  },

  goToQuestion: (index: number) => {
    const { session } = get();
    if (!session) return;
    if (index >= 0 && index < session.questions.length) {
      set({
        session: {
          ...session,
          currentIndex: index,
        },
      });
    }
  },

  completeSession: () => {
    const { session } = get();
    if (!session) return;
    set({
      session: {
        ...session,
        endTime: Date.now(),
        isCompleted: true,
      },
    });
  },

  clearSession: () => {
    set({ session: null });
  },

  getCurrentQuestion: () => {
    const { session } = get();
    if (!session) return null;
    return session.questions[session.currentIndex] || null;
  },

  getProgress: () => {
    const { session } = get();
    if (!session) return { answered: 0, total: 0, correct: 0 };
    const answers = Object.values(session.answers);
    return {
      answered: answers.length,
      total: session.questions.length,
      correct: answers.filter((a) => a.isCorrect).length,
    };
  },

  getResults: () => {
    const { session } = get();
    if (!session || !session.isCompleted) return null;
    const answers = Object.values(session.answers);
    const correct = answers.filter((a) => a.isCorrect).length;
    const totalTime = answers.reduce((sum, a) => sum + a.timeTaken, 0);
    return {
      score: correct,
      accuracy: session.questions.length > 0 ? (correct / session.questions.length) * 100 : 0,
      totalTime,
      answers,
    };
  },
}));


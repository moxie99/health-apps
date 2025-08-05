import { create } from 'zustand';

interface AppState {
  // App-level state
  isInitialized: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;

  // Actions
  setInitialized: (initialized: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
}

export const useAppStore = create<AppState>(set => ({
  // Initial State
  isInitialized: false,
  theme: 'system',
  language: 'en',

  // Actions
  setInitialized: (initialized: boolean) => {
    set({ isInitialized: initialized });
  },

  setTheme: (theme: 'light' | 'dark' | 'system') => {
    set({ theme });
  },

  setLanguage: (language: string) => {
    set({ language });
  },
}));

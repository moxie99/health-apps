/* eslint-disable @typescript-eslint/no-unused-vars */
// store/authStore.ts
import { create } from 'zustand';
import { tokenStorage } from '../storage/mmkv';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  vehicleType?: string;
  licenseNumber?: string;
  status?: 'pending' | 'approved' | 'suspended';
  kycStatus?: 'incomplete' | 'pending' | 'verified' | 'rejected';
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: User | null;
  error: string | null;

  // Actions
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial State
  isAuthenticated: false,
  isLoading: false,
  token: null,
  user: null,
  error: null,

  // Actions
  login: async (token: string, user: User) => {
    try {
      set({ isLoading: true, error: null });

      // Save token securely using MMKV
      tokenStorage.setToken(token);
      tokenStorage.setUserData(user.id, user.email);

      set({
        isAuthenticated: true,
        token,
        user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });

      // Clear secure storage
      tokenStorage.clearAll();

      set({
        isAuthenticated: false,
        token: null,
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Logout failed',
        isLoading: false,
      });
    }
  },

  setUser: (user: User) => {
    set({ user });
    tokenStorage.setUserData(user.id, user.email);
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  initializeAuth: () => {
    try {
      const isAuthenticated = tokenStorage.isAuthenticated();
      const token = tokenStorage.getToken();
      const userData = tokenStorage.getUserData();

      if (isAuthenticated && token && userData.userId && userData.email) {
        set({
          isAuthenticated: true,
          token,
          user: {
            id: userData.userId,
            email: userData.email,
            name: '', // Will be populated from API call or stored data
          },
        });
      } else {
        // Clear any inconsistent data
        tokenStorage.clearAll();
        set({
          isAuthenticated: false,
          token: null,
          user: null,
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({
        isAuthenticated: false,
        token: null,
        user: null,
        error: 'Failed to initialize authentication',
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

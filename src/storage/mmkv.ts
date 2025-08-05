// storage/mmkv.ts
import { MMKV } from 'react-native-mmkv';

// Create MMKV instance for secure storage
export const secureStorage = new MMKV({
  id: 'secure-storage',
  encryptionKey: 'your-encryption-key-here', // Use a secure key in production
});

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  USER_EMAIL: 'user_email',
  IS_AUTHENTICATED: 'is_authenticated',
} as const;

// Helper functions for token management
export const tokenStorage = {
  setToken: (token: string) => {
    secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, token);
    secureStorage.set(STORAGE_KEYS.IS_AUTHENTICATED, true);
  },

  getToken: (): string | undefined => {
    return secureStorage.getString(STORAGE_KEYS.AUTH_TOKEN);
  },

  removeToken: () => {
    secureStorage.delete(STORAGE_KEYS.AUTH_TOKEN);
    secureStorage.set(STORAGE_KEYS.IS_AUTHENTICATED, false);
  },

  isAuthenticated: (): boolean => {
    return secureStorage.getBoolean(STORAGE_KEYS.IS_AUTHENTICATED) || false;
  },

  setUserData: (userId: string, email: string) => {
    secureStorage.set(STORAGE_KEYS.USER_ID, userId);
    secureStorage.set(STORAGE_KEYS.USER_EMAIL, email);
  },

  getUserData: () => {
    return {
      userId: secureStorage.getString(STORAGE_KEYS.USER_ID),
      email: secureStorage.getString(STORAGE_KEYS.USER_EMAIL),
    };
  },

  clearAll: () => {
    secureStorage.clearAll();
  },
};

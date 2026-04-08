/**
 * Auth Store
 *
 * Manages authentication state: user session, tokens, auth status.
 * This is the source of truth for "is the user logged in?"
 */

import {create} from 'zustand';

export interface User {
  id: string;
  username: string;
  email?: string;
  walletAddress: string;
  avatarId?: string;
  createdAt: string;
}

interface AuthState {
  // ── State ────────────────────────────────
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBiometricEnabled: boolean;
  isUnlocked: boolean; // Governs if the user has passed the biometric gate
  isLocked: boolean; // Protects the active session due to inactivity
  lastActiveAt: number; // Timestamp of the last user interaction

  // ── Actions ──────────────────────────────
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setAuthenticated: (status: boolean) => void;
  setLoading: (loading: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setUnlocked: (status: boolean) => void;
  lock: () => void;
  unlock: () => void;
  updateActivity: () => void;
  login: (user: User, token: string, isRestoredSession?: boolean) => void;
  logout: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isBiometricEnabled: false,
  isUnlocked: false,
  isLocked: false,
  lastActiveAt: Date.now(),
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setUser: (user) => set({user}),
  setAccessToken: (accessToken) => set({accessToken}),
  setAuthenticated: (isAuthenticated) => set({isAuthenticated}),
  setLoading: (isLoading) => set({isLoading}),
  setBiometricEnabled: (isBiometricEnabled) => set({isBiometricEnabled}),
  setUnlocked: (isUnlocked) => set({isUnlocked}),

  lock: () => set({isLocked: true}),
  
  unlock: () => set({
    isLocked: false,
    lastActiveAt: Date.now(),
  }),

  updateActivity: () => set({lastActiveAt: Date.now()}),

  login: (user, accessToken, isRestoredSession = false) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
      // If the session was restored from disk, require them to unlock via PIN/Biometrics first
      isLocked: isRestoredSession,
      lastActiveAt: Date.now(),
    }),

  logout: () =>
    set({
      ...initialState,
    }),

  reset: () => set(initialState),
}));

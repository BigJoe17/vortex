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

  // ── Actions ──────────────────────────────
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setAuthenticated: (status: boolean) => void;
  setLoading: (loading: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isBiometricEnabled: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setUser: (user) => set({user}),
  setAccessToken: (accessToken) => set({accessToken}),
  setAuthenticated: (isAuthenticated) => set({isAuthenticated}),
  setLoading: (isLoading) => set({isLoading}),
  setBiometricEnabled: (isBiometricEnabled) => set({isBiometricEnabled}),

  login: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    }),

  logout: () =>
    set({
      ...initialState,
    }),

  reset: () => set(initialState),
}));

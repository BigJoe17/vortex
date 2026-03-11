/**
 * Token Store
 *
 * Manages the wallet's detected ERC-20 tokens, balances, and real-time USD equivalent valuations.
 */

import { create } from 'zustand';
import type { TokenWithBalance } from '@services/token/tokenService';

export interface TokenWithUsd extends TokenWithBalance {
  balanceUsd: string;
}

interface TokenState {
  // ── State ────────────────────────────────
  tokens: TokenWithUsd[];
  totalTokenUsdValue: string;
  loading: boolean;
  lastUpdated: number | null;

  // ── Actions ──────────────────────────────
  setTokens: (tokens: TokenWithUsd[]) => void;
  updateTotalUsd: (total: string) => void;
  addToken: (token: TokenWithUsd) => void;
  updateTokenBalance: (address: string, newBalance: string, newFormatted: string, newUsd: string) => void;
  setLoading: (loading: boolean) => void;
  clearTokens: () => void;
  reset: () => void;
}

const initialState = {
  tokens: [] as TokenWithUsd[],
  totalTokenUsdValue: '0.00',
  loading: false,
  lastUpdated: null as number | null,
};

export const useTokenStore = create<TokenState>((set) => ({
  ...initialState,

  setTokens: (tokens) =>
    set({
      tokens,
      lastUpdated: Date.now(),
    }),

  updateTotalUsd: (totalTokenUsdValue) => set({ totalTokenUsdValue }),

  addToken: (token) =>
    set((state) => ({
      tokens: [...state.tokens, token],
      lastUpdated: Date.now(),
    })),

  updateTokenBalance: (address, newBalance, newFormatted, newUsd) =>
    set((state) => ({
      tokens: state.tokens.map((t) =>
        t.address.toLowerCase() === address.toLowerCase()
          ? { ...t, balance: newBalance, balanceFormatted: newFormatted, balanceUsd: newUsd }
          : t
      ),
      lastUpdated: Date.now(),
    })),

  setLoading: (loading) => set({ loading }),

  clearTokens: () =>
    set({
      tokens: [],
      totalTokenUsdValue: '0.00',
      lastUpdated: null,
    }),

  reset: () => set(initialState),
}));

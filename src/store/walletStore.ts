/**
 * Wallet Store
 *
 * Manages wallet state: address, balances, network, tokens.
 * The actual ethers.Wallet instance is NOT stored here —
 * it's recreated on-demand from secure storage for security.
 */

import {create} from 'zustand';

export interface TokenBalance {
  address: string;         // Contract address (0x0 for native)
  symbol: string;
  name: string;
  decimals: number;
  balance: string;         // Raw balance (wei)
  balanceFormatted: string; // Human-readable balance
  balanceUsd: string;      // USD equivalent
  logoUri?: string;
  priceChangePercent24h?: number;
}

export type NetworkId = 'polygon' | 'ethereum' | 'polygon-amoy' | 'localhost';

interface WalletState {
  // ── State ────────────────────────────────
  address: string | null;
  network: NetworkId;
  tokens: TokenBalance[];
  totalBalanceUsd: string;
  isLoadingBalances: boolean;
  isWalletLoaded: boolean;
  lastUpdated: number | null;

  // ── Actions ──────────────────────────────
  initWallet: (address: string) => void;
  setAddress: (address: string) => void;
  setNetwork: (network: NetworkId) => void;
  setTokens: (tokens: TokenBalance[]) => void;
  setTotalBalanceUsd: (total: string) => void;
  setLoadingBalances: (loading: boolean) => void;
  clearWallet: () => void;
  reset: () => void;
}

const initialState = {
  address: null as string | null,
  network: 'polygon-amoy' as NetworkId,
  tokens: [] as TokenBalance[],
  totalBalanceUsd: '0.00',
  isLoadingBalances: false,
  isWalletLoaded: false,
  lastUpdated: null as number | null,
};

export const useWalletStore = create<WalletState>((set) => ({
  ...initialState,

  initWallet: (address) =>
    set({
      address,
      isWalletLoaded: true,
    }),

  setAddress: (address) => set({address}),
  setNetwork: (network) => set({network}),
  setTokens: (tokens) => set({tokens, lastUpdated: Date.now()}),
  setTotalBalanceUsd: (totalBalanceUsd) => set({totalBalanceUsd}),
  setLoadingBalances: (isLoadingBalances) => set({isLoadingBalances}),

  clearWallet: () =>
    set({
      ...initialState,
    }),

  reset: () => set(initialState),
}));

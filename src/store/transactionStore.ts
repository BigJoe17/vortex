/**
 * Transaction Store
 *
 * Manages transaction history and pending transactions.
 */

import {create} from 'zustand';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type TransactionType = 'send' | 'receive' | 'swap' | 'approve';

export interface Transaction {
  hash: string;
  type: TransactionType;
  status: TransactionStatus;
  from: string;
  to: string;
  value: string;
  valueFormatted: string;
  tokenSymbol: string;
  tokenAddress: string;
  gasUsed?: string;
  gasPriceGwei?: string;
  timestamp: number;
  blockNumber?: number;
  nonce?: number;
}

interface TransactionState {
  // ── State ────────────────────────────────
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  isLoading: boolean;

  // ── Actions ──────────────────────────────
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (hash: string, updates: Partial<Transaction>) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  transactions: [] as Transaction[],
  pendingTransactions: [] as Transaction[],
  isLoading: false,
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  ...initialState,

  setTransactions: (transactions) => set({transactions}),

  addTransaction: (tx) =>
    set((state) => {
      if (tx.status === 'pending') {
        return {
          pendingTransactions: [tx, ...state.pendingTransactions],
        };
      }
      return {
        transactions: [tx, ...state.transactions],
      };
    }),

  updateTransaction: (hash, updates) =>
    set((state) => {
      const updatedPending = state.pendingTransactions.map((tx) =>
        tx.hash === hash ? {...tx, ...updates} : tx,
      );

      // Move confirmed/failed transactions from pending to history
      const nowConfirmed = updatedPending.filter(
        (tx) => tx.status !== 'pending',
      );
      const stillPending = updatedPending.filter(
        (tx) => tx.status === 'pending',
      );

      return {
        pendingTransactions: stillPending,
        transactions: [...nowConfirmed, ...state.transactions],
      };
    }),

  setLoading: (isLoading) => set({isLoading}),

  reset: () => set(initialState),
}));

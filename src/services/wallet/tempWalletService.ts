/**
 * Temporary Wallet Service
 *
 * Holds the raw generated wallet in volatile memory ONLY during onboarding.
 * Auto-clears after 5 minutes as a safety net against abandoned flows.
 * Never persists data to disk or global state stores.
 */

import { WalletResult } from './walletService';

const AUTO_CLEAR_MS = 5 * 60 * 1000;

let tempWallet: WalletResult | null = null;
let clearTimer: ReturnType<typeof setTimeout> | null = null;

export const tempWalletService = {
  setTempWallet(wallet: WalletResult): void {
    tempWallet = wallet;

    if (clearTimer) {
      clearTimeout(clearTimer);
    }
    clearTimer = setTimeout(() => {
      tempWalletService.clearTempWallet();
    }, AUTO_CLEAR_MS);
  },

  getTempWallet(): WalletResult | null {
    return tempWallet;
  },

  clearTempWallet(): void {
    if (clearTimer) {
      clearTimeout(clearTimer);
      clearTimer = null;
    }
    tempWallet = null;
  },
};

/**
 * Temporary Wallet Service
 *
 * Securely maintains the raw generated wallet completely in volatile memory.
 * Never persists data to disk or global state stores.
 */

import { WalletResult } from './walletService';

let tempWallet: WalletResult | null = null;

export const tempWalletService = {
  /**
   * Stashes the currently generating wallet in deep memory
   */
  setTempWallet(wallet: WalletResult): void {
    tempWallet = wallet;
  },

  /**
   * Retrieves the raw wallet for phrase presentation / encryption dumping
   */
  getTempWallet(): WalletResult | null {
    return tempWallet;
  },

  /**
   * Critically erases the memory footprint to leave no trace locally
   */
  clearTempWallet(): void {
    tempWallet = null;
  },
};

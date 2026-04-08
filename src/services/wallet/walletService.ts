/**
 * Wallet Service
 *
 * Pure wallet operations using ethers.js.
 * No side effects, no storage — just crypto operations.
 *
 * SECURITY: Private keys are returned but NEVER logged.
 */

import {ethers} from 'ethers';

export interface WalletResult {
  address: string;
  privateKey: string;
  mnemonic?: string;
}

/**
 * Import a wallet from a private key string.
 * Accepts with or without '0x' prefix.
 */
export function importFromPrivateKey(key: string): WalletResult {
  const trimmed = key.trim();
  const prefixed = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;

  // ethers will throw if the key is invalid
  const wallet = new ethers.Wallet(prefixed);

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Creates a brand new fully randomized wallet instance.
 * Returns the address, private key, and securely generated raw seed mnemonic phrase.
 */
export function createWallet(): WalletResult {
  const wallet = ethers.Wallet.createRandom();
  
  if (!wallet.mnemonic) {
    throw new Error('Failed to generate secure mnemonic phrase');
  }

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  };
}

/**
 * Import a wallet from a BIP-39 seed phrase (mnemonic).
 * Supports 12 or 24 words.
 * Uses default derivation path: m/44'/60'/0'/0/0
 */
export function importFromSeedPhrase(mnemonic: string): WalletResult {
  const trimmed = mnemonic.trim().toLowerCase();

  // ethers will throw if the mnemonic is invalid
  const wallet = ethers.Wallet.fromPhrase(trimmed);

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Validate a private key without creating a wallet.
 */
export function validatePrivateKey(key: string): boolean {
  try {
    const trimmed = key.trim();
    const prefixed = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
    new ethers.Wallet(prefixed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a BIP-39 mnemonic phrase.
 */
export function validateMnemonic(mnemonic: string): boolean {
  try {
    const trimmed = mnemonic.trim().toLowerCase();
    return ethers.Mnemonic.isValidMnemonic(trimmed);
  } catch {
    return false;
  }
}

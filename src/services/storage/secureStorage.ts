/**
 * Secure Storage Service
 *
 * Wrapper around expo-secure-store.
 * Uses Keychain (iOS) / Keystore (Android) for encryption.
 *
 * IMPORTANT: All sensitive data MUST go through this service.
 * Private keys must NEVER be logged or sent over the network.
 */

import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  SESSION_TOKEN: 'vortex_session_token',
  REFRESH_TOKEN: 'vortex_refresh_token',
  USER_DATA: 'vortex_user_data',
  BIOMETRIC_KEY: 'vortex_biometric_key',
  WALLET_METADATA: 'vortex_wallet_metadata',
  PRIVATE_KEY: 'vortex_private_key',
  WALLET_ADDRESS: 'vortex_wallet_address',
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

class SecureStorageService {
  /**
   * Store a string value securely.
   */
  async setItem(key: StorageKey, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`[SecureStorage] Error setting ${key}:`, error);
      throw new Error(`Failed to save secure data: ${key}`);
    }
  }

  /**
   * Retrieve a stored string value.
   */
  async getItem(key: StorageKey): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Store a JSON object securely.
   */
  async setObject<T>(key: StorageKey, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  }

  /**
   * Retrieve and parse a stored JSON object.
   */
  async getObject<T>(key: StorageKey): Promise<T | null> {
    const value = await this.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      console.error(`[SecureStorage] Failed to parse ${key}`);
      return null;
    }
  }

  /**
   * Remove a stored value.
   */
  async removeItem(key: StorageKey): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Error removing ${key}:`, error);
    }
  }

  /**
   * Clear all vortex-related secure storage.
   */
  async clearAll(): Promise<void> {
    const keys = Object.values(STORAGE_KEYS);
    await Promise.all(keys.map((key) => this.removeItem(key)));
  }

  // ── Session helpers ────────────────────────────

  async saveSession(accessToken: string, refreshToken?: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.SESSION_TOKEN, accessToken);
    if (refreshToken) {
      await this.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  }

  async getSessionToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.SESSION_TOKEN);
  }

  async clearSession(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    await this.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await this.removeItem(STORAGE_KEYS.USER_DATA);
  }

  // ── Wallet helpers ─────────────────────────────

  /**
   * Store wallet credentials securely.
   * SECURITY: privateKey is encrypted at rest by the OS keystore.
   */
  async saveWallet(privateKey: string, address: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.PRIVATE_KEY, privateKey);
    await this.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
  }

  /**
   * Retrieve stored wallet credentials.
   * Returns null if no wallet is stored.
   */
  async getWallet(): Promise<{privateKey: string; address: string} | null> {
    const privateKey = await this.getItem(STORAGE_KEYS.PRIVATE_KEY);
    const address = await this.getItem(STORAGE_KEYS.WALLET_ADDRESS);
    if (!privateKey || !address) return null;
    return {privateKey, address};
  }

  /**
   * Check if a wallet is stored.
   */
  async hasWallet(): Promise<boolean> {
    const address = await this.getItem(STORAGE_KEYS.WALLET_ADDRESS);
    return address !== null;
  }

  /**
   * Delete all wallet data.
   */
  async deleteWallet(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.PRIVATE_KEY);
    await this.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
    await this.removeItem(STORAGE_KEYS.WALLET_METADATA);
  }
}

export const secureStorage = new SecureStorageService();
export {STORAGE_KEYS};

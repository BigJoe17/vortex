/**
 * Encryption Service
 *
 * AES-256 encryption for private keys using a user-defined PIN.
 * PIN is never stored raw — only its SHA-256 hash is persisted.
 *
 * SECURITY:
 * - Private keys are encrypted at rest with AES
 * - PIN is hashed with SHA-256 before storage
 * - Decrypted keys exist only in function scope, never in state
 * - All errors throw without leaking sensitive data
 */

import CryptoJS from 'crypto-js';

/**
 * Encrypt a private key using a PIN as the passphrase.
 * Returns a Base64-encoded ciphertext string.
 *
 * @throws {Error} If encryption fails
 */
export function encryptPrivateKey(privateKey: string, pin: string): string {
  if (!privateKey || !pin) {
    throw new Error('Private key and PIN are required for encryption');
  }

  try {
    // Derive a stronger key from the PIN using PBKDF2 (Hardened to 100,000 iterations)
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const key = CryptoJS.PBKDF2(pin, salt, {
      keySize: 256 / 32,
      iterations: 100000,
    });

    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    const encrypted = CryptoJS.AES.encrypt(privateKey, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Pack ciphertext + iv + salt precisely as requested
    const payload = {
      ciphertext: encrypted.toString(),
      iv: iv.toString(),
      salt: salt.toString(),
    };

    return JSON.stringify(payload);
  } catch {
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt an encrypted private key using the original PIN.
 *
 * @throws {Error} If PIN is wrong or data is corrupted
 */
export function decryptPrivateKey(encryptedPayload: string, pin: string): string {
  if (!encryptedPayload || !pin) {
    throw new Error('Encrypted key and PIN are required for decryption');
  }

  try {
    const payload = JSON.parse(encryptedPayload);
    const salt = CryptoJS.enc.Hex.parse(payload.salt);
    const iv = CryptoJS.enc.Hex.parse(payload.iv);

    // Re-derive the same key from PIN + stored salt (Hardened to 100,000 iterations)
    const key = CryptoJS.PBKDF2(pin, salt, {
      keySize: 256 / 32,
      iterations: 100000,
    });

    const decrypted = CryptoJS.AES.decrypt(payload.ciphertext, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

    if (!plaintext) {
      throw new Error('Invalid PIN');
    }

    return plaintext;
  } catch (error) {
    // Re-throw our own error, never leak internal details
    if (error instanceof Error && error.message === 'Invalid PIN') {
      throw error;
    }
    throw new Error('Decryption failed — invalid PIN or corrupted data');
  }
}

/**
 * Validate PIN meets minimum security requirements.
 * Rejects trivial sequences and repeated digits.
 */
export function validatePinStrength(pin: string): {valid: boolean; reason?: string} {
  if (!pin || pin.length < 6) {
    return {valid: false, reason: 'PIN must be at least 6 digits'};
  }

  // Reject all-same digits (e.g., 111111, 000000)
  if (/^(.)\1+$/.test(pin)) {
    return {valid: false, reason: 'PIN cannot be all the same digit'};
  }

  // Reject simple ascending/descending sequences (123456, 654321)
  const ascending = '0123456789';
  const descending = '9876543210';
  if (ascending.includes(pin) || descending.includes(pin)) {
    return {valid: false, reason: 'PIN cannot be a simple sequence'};
  }

  return {valid: true};
}

/**
 * Hash a PIN using SHA-256.
 * Only the hash is stored — the raw PIN is never persisted.
 */
export function hashPin(pin: string): string {
  if (!pin) {
    throw new Error('PIN is required');
  }
  return CryptoJS.SHA256(pin).toString();
}

/**
 * Verify a PIN against a stored SHA-256 hash.
 * Returns true if the PIN matches, false otherwise.
 */
export function verifyPin(inputPin: string, storedHash: string): boolean {
  if (!inputPin || !storedHash) {
    return false;
  }
  const inputHash = CryptoJS.SHA256(inputPin).toString();
  return inputHash === storedHash;
}
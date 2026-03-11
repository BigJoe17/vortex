/**
 * Validation Utilities
 *
 * Input validators for wallet addresses, amounts, usernames, etc.
 */

/**
 * Validate an Ethereum/Polygon address format.
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate a transaction hash format.
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate a username.
 * Rules: 3–20 chars, alphanumeric + underscores, must start with letter.
 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(username);
}

/**
 * Validate a token amount string.
 * Must be a positive number with optional decimals.
 */
export function isValidAmount(amount: string): boolean {
  if (!amount || amount.trim() === '') return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && /^\d*\.?\d*$/.test(amount);
}

/**
 * Validate an email address.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Check if amount exceeds balance.
 */
export function exceedsBalance(amount: string, balance: string): boolean {
  const amountNum = parseFloat(amount);
  const balanceNum = parseFloat(balance);
  if (isNaN(amountNum) || isNaN(balanceNum)) return true;
  return amountNum > balanceNum;
}

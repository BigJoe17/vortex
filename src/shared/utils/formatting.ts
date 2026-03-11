/**
 * Formatting Utilities
 *
 * Pure functions for formatting blockchain data for display.
 */

/**
 * Truncate a wallet address for display.
 * 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38 → 0x742d...bD38
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a token balance for display.
 * Handles large and small numbers appropriately.
 */
export function formatBalance(balance: string, decimals = 4): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0.00';
  if (num === 0) return '0.00';
  if (num < 0.0001) return '< 0.0001';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(decimals);
}

/**
 * Format a token balance with a maximum of 2 decimal places.
 * e.g., 1.23451234 -> "1.23", 1200.444 -> "1,200.44"
 */
export function formatTokenBalance(balanceFormatted: string): string {
  if (!balanceFormatted) return '0.00';
  const num = parseFloat(balanceFormatted);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
}

/**
 * Format USD value.
 */
export function formatUsd(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a percentage change with sign.
 * 5.23 → "+5.23%"
 * -2.1 → "-2.10%"
 */
export function formatPercentChange(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

/**
 * Format a timestamp to relative time.
 * e.g., "2 min ago", "1 hour ago", "3 days ago"
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format gas price in Gwei.
 */
export function formatGwei(gweiValue: string): string {
  const num = parseFloat(gweiValue);
  if (isNaN(num)) return '0';
  return `${num.toFixed(1)} Gwei`;
}

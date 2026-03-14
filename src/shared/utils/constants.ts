/**
 * Shared Constants
 *
 * App-wide configuration constants.
 */

export const APP_CONFIG = {
  name: 'Vortex',
  version: '0.0.1',
  environment: __DEV__ ? 'development' : 'production',
} as const;

export const CHAIN_CONFIG = {
  polygon: {
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2',
    explorerUrl: 'https://polygonscan.com',
    decimals: 18,
  },
  'polygon-amoy': {
    chainId: 80002,
    name: 'Polygon Amoy',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-amoy.g.alchemy.com/v2',
    explorerUrl: 'https://amoy.polygonscan.com',
    decimals: 18,
  },
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2',
    explorerUrl: 'https://etherscan.io',
    decimals: 18,
  },
  localhost: {
    chainId: 31337,
    name: 'Localhost',
    symbol: 'ETH',
    rpcUrl: 'http://192.168.1.6:8545',
    explorerUrl: '',
    decimals: 18,
  },
} as const;

export const NATIVE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

/** Minimum balance check intervals in milliseconds */
export const REFRESH_INTERVALS = {
  balance: 30_000,      // 30 seconds
  transactions: 60_000, // 1 minute
  prices: 30_000,      // 30 seconds
} as const;

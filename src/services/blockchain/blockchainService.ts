/**
 * Blockchain Service
 *
 * Connects to Alchemy RPC and fetches on-chain data.
 * Uses ethers.js JsonRpcProvider with cached singleton pattern.
 *
 * IMPORTANT: Never log private keys or wallet secrets through this service.
 */

import {ethers} from 'ethers';
import {CHAIN_CONFIG, NATIVE_TOKEN_ADDRESS} from '@shared/utils/constants';
import type {NetworkId, TokenBalance} from '@store/walletStore';

/**
 * Alchemy API key.
 * NOTE: In production, use a proper secrets management solution.
 * react-native-dotenv is listed but the babel plugin is not configured,
 * so process.env won't work. Using direct constant for now.
 */
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || '1lWiJ3EsZ9olS4Bk4N6bX';

// Cached provider instances (one per network)
const providers: Partial<Record<NetworkId, ethers.JsonRpcProvider>> = {};

/**
 * Get a cached JSON RPC provider for the given network.
 */
export function getProvider(network: NetworkId): ethers.JsonRpcProvider {
  if (providers[network]) {
    
    return providers[network]!;
  }

  const config = CHAIN_CONFIG[network];
  const url = network === 'localhost' ? config.rpcUrl : `${config.rpcUrl}/${ALCHEMY_API_KEY}`;

  const provider = new ethers.JsonRpcProvider(url, {
    chainId: config.chainId,
    name: config.name,
  });

  providers[network] = provider;
  return provider;
}

/**
 * Fetch the native token balance for an address.
 */
export async function getNativeBalance(
  address: string,
  network: NetworkId,
): Promise<{balance: string; formatted: string}> {
  const provider = getProvider(network);
  const balance = await provider.getBalance(address);
  const formatted = ethers.formatEther(balance);

  return {
    balance: balance.toString(),
    formatted: parseFloat(formatted).toFixed(6),
  };
}

/**
 * Fetch an ERC-20 token balance for an address.
 */
export async function getTokenBalance(
  address: string,
  tokenAddress: string,
  network: NetworkId,
): Promise<{balance: string; formatted: string; decimals: number}> {
  const provider = getProvider(network);

  // Minimal ERC-20 ABI for balanceOf + decimals
  const erc20Abi = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
  ];

  const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
  const balanceOfFn = contract.getFunction('balanceOf');
  const decimalsFn = contract.getFunction('decimals');
  const [balance, decimals] = await Promise.all([
    balanceOfFn(address),
    decimalsFn(),
  ]);

  const formatted = ethers.formatUnits(balance, decimals);

  return {
    balance: balance.toString(),
    formatted: parseFloat(formatted).toFixed(6),
    decimals: Number(decimals),
  };
}

/**
 * Fetch all balances for the Wallet screen.
 * Returns native token + configured ERC-20 tokens.
 */
export async function fetchWalletBalances(
  address: string,
  network: NetworkId,
): Promise<TokenBalance[]> {
  const config = CHAIN_CONFIG[network];

  try {
    const nativeResult = await getNativeBalance(address, network);

    const nativeToken: TokenBalance = {
      address: NATIVE_TOKEN_ADDRESS,
      symbol: config.symbol,
      name: config.name,
      decimals: config.decimals,
      balance: nativeResult.balance,
      balanceFormatted: nativeResult.formatted,
      balanceUsd: '0.00', // Price oracle integration in a future phase
    };

    return [nativeToken];
  } catch (error) {
    console.error(`[Blockchain] Failed to fetch balances for ${network}:`, error);
    // Clear cached provider so next attempt creates a fresh one
    providers[network]?.destroy();
    delete providers[network];
    return [];
  }
}

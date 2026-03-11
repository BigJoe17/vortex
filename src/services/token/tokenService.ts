/**
 * Token Service
 *
 * Handles fetching ERC-20 token balances and metadata.
 * Uses ethers.js and Alchemy's specialized Token API where available.
 */

import { ethers } from 'ethers';
import { getProvider } from '@services/blockchain/blockchainService';
import type { NetworkId } from '@store/walletStore';

export interface TokenMetadata {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoUri?: string;
}

export interface TokenWithBalance extends TokenMetadata {
  balance: string;
  balanceFormatted: string;
}

// Memory cache for metadata to minimize RPC calls
const tokenMetadataCache: Record<string, TokenMetadata> = {};

/**
 * Fetch all non-zero ERC-20 token balances for a wallet address using Alchemy Token API
 */
export async function fetchTokens(address: string, network: NetworkId): Promise<TokenWithBalance[]> {
  try {
    const provider = getProvider(network);

    // alchemy_getTokenBalances returns all ERC-20 tokens for an address
    const rawBalances = await provider.send('alchemy_getTokenBalances', [address]);

    if (!rawBalances || !rawBalances.tokenBalances) {
      return [];
    }

    const tokens: TokenWithBalance[] = [];

    // Filter out zero-balance tokens to save API calls on metadata
    const activeTokens = rawBalances.tokenBalances.filter(
      (token: any) => token.tokenBalance !== '0x' && token.tokenBalance !== '0x0' && token.tokenBalance !== '0'
    );

    // Process all active tokens (you could limit this via standard Promise.all batching in high-volume production apps)
    for (const raw of activeTokens) {
      try {
        const metadata = await getTokenMetadata(raw.contractAddress, provider);
        
        // Ensure BigInt conversion safely drops prefix if present
        const balanceBigInt = BigInt(raw.tokenBalance);
        const balanceStr = balanceBigInt.toString();
        
        // Format decimal balance
        const balanceFormatted = ethers.formatUnits(balanceBigInt, metadata.decimals);

        tokens.push({
          ...metadata,
          balance: balanceStr,
          balanceFormatted,
        });
      } catch (e) {
        console.warn(`[TokenService] Failed to process metadata for ${raw.contractAddress}`, e);
        // Continue loop even if one token fails
      }
    }

    return tokens;
  } catch (error) {
    console.error('[TokenService] Failed to fetch tokens from Alchemy API:', error);
    // In actual production, ensure it degrades gracefully
    return [];
  }
}

/**
 * Fetch token metadata (symbol, name, decimals) using Alchemy Token Metadata API
 */
export async function getTokenMetadata(contractAddress: string, provider: ethers.JsonRpcProvider): Promise<TokenMetadata> {
  const addressKey = contractAddress.toLowerCase();
  
  // Return cached result if available
  if (tokenMetadataCache[addressKey]) {
    return tokenMetadataCache[addressKey];
  }

  try {
    const metadata = await provider.send('alchemy_getTokenMetadata', [contractAddress]);
    
    const result: TokenMetadata = {
      address: contractAddress,
      name: metadata.name || 'Unknown Token',
      symbol: metadata.symbol || '???',
      decimals: metadata.decimals ?? 18,
      logoUri: metadata.logo,
    };

    // Store in cache
    tokenMetadataCache[addressKey] = result;
    return result;
  } catch (error) {
    console.warn(`[TokenService] Could not fetch metadata for ${contractAddress}:`, error);
    
    // Create safe fallback structure on failure so UI does not crash
    const fallback: TokenMetadata = {
      address: contractAddress,
      name: 'Unknown',
      symbol: '???',
      decimals: 18, // Assume standard decimals on fallback
    };
    
    // Do NOT cache a failed result so it can be retried in the future
    return fallback;
  }
}

export async function fetchTokenBalances(address: string, network: NetworkId): Promise<TokenWithBalance[]> {
  return fetchTokens(address, network);
}

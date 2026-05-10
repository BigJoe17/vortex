/**
 * Production Wallet Price Service
 */

import type { NetworkId } from '@store/walletStore';
import {getCoinGeckoBaseUrl} from '@shared/utils/env';

type MarketNetwork = 'ethereum' | 'polygon';

function toMarketNetwork(network: NetworkId): MarketNetwork {
  switch (network) {
    case 'ethereum':
      return 'ethereum';
    case 'polygon':
    case 'polygon-amoy':
    case 'localhost':
      return 'polygon';
  }
}

interface PriceCacheEntry {
  price: number
  timestamp: number
}

const priceCache: Record<string, PriceCacheEntry> = {}

const CACHE_TTL_MS = 120000

export async function fetchTokenPrices(
  contracts: string[],
  network: NetworkId
): Promise<Record<string, number>> {

  const now = Date.now()
  const results: Record<string, number> = {}

  const neededContracts: string[] = []

  for (const contract of contracts) {

    const key = `${network}:${contract}`.toLowerCase()

    const entry = priceCache[key]

    if (entry && now - entry.timestamp < CACHE_TTL_MS) {
      results[contract] = entry.price
    } else {
      neededContracts.push(contract)
    }
  }

  if (neededContracts.length === 0) return results

  try {

    const resolved = toMarketNetwork(network);
    const platformId = resolved === 'polygon' ? 'polygon-pos' : 'ethereum';
    const contractQuery = neededContracts.join(',').toLowerCase();

    const url =
      `${getCoinGeckoBaseUrl()}/simple/token_price/${platformId}` +
      `?contract_addresses=${contractQuery}&vs_currencies=usd`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko error ${response.status}`);
    }

    const data = (await response.json()) as Record<string, { usd?: number }>;

    for (const contract of neededContracts) {
      // CoinGecko returns keys in lowercase
      const price = data[contract.toLowerCase()]?.usd ?? 0;

      results[contract] = price;

      const key = `${network}:${contract}`.toLowerCase();

      priceCache[key] = {
        price,
        timestamp: now
      };
    }

  } catch (err) {

    console.warn('[PriceService] price fetch failed', err)

    for (const contract of neededContracts) {
      results[contract] = 0
    }
  }

  return results
}

export async function fetchNativeTokenPrice(network: NetworkId): Promise<number> {
  const resolved = toMarketNetwork(network);
  const coinId = resolved === 'polygon' ? 'matic-network' : 'ethereum';
  const url = `${getCoinGeckoBaseUrl()}/simple/price?ids=${coinId}&vs_currencies=usd`;
  try {
    const response = await fetch(url);
    if (!response.ok) return 0;
    const data = (await response.json()) as Record<string, { usd?: number }>;
    return data[coinId]?.usd ?? 0;
  } catch {
    return 0;
  }
}


export function getTokenUsdValue(
  balanceFormatted: string,
  priceUsd: number
): string {

  const balance = parseFloat(balanceFormatted)

  if (!balance || !priceUsd) return '0.00'

  const total = balance * priceUsd

  return total.toFixed(2)
}

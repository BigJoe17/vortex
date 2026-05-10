import { useQuery } from '@tanstack/react-query';

export interface MarketData {
  price: number;
  image: string;
  name: string;
  symbol: string;
}

// Hardcoded map for popular native and ERC-20 tokens (Symbol -> CoinGecko ID)
const COMMON_COIN_IDS: Record<string, string> = {
  eth: 'ethereum',
  matic: 'matic-network',
  usdc: 'usd-coin',
  usdt: 'tether',
  weth: 'weth',
  link: 'chainlink',
  uni: 'uniswap',
  aave: 'aave',
  dai: 'dai',
  shib: 'shiba-inu',
  wbtc: 'wrapped-bitcoin',
  pepe: 'pepe',
};

// In-memory cache to avoid repeated /contract calls
const contractToIdCache = new Map<string, string>();

/**
 * Returns the resolved CoinGecko ID for a token symbol or address.
 */
export function getResolvedCoinId(address: string, symbol: string): string | null {
  const symbolLower = symbol.toLowerCase();
  if (COMMON_COIN_IDS[symbolLower]) {
    return COMMON_COIN_IDS[symbolLower];
  }
  const addressLower = address.toLowerCase();
  if (contractToIdCache.has(addressLower)) {
    return contractToIdCache.get(addressLower) || null;
  }
  return null;
}

export async function fetchMarketData(
  tokens: { symbol: string; address: string }[],
  network: 'ethereum' | 'polygon'
): Promise<Record<string, MarketData>> {
  const platformId = network === 'polygon' ? 'polygon-pos' : 'ethereum';
  const marketDataMap: Record<string, MarketData> = {};
  
  const knownIds: string[] = [];
  const unknownTokens: { symbol: string; address: string }[] = [];

  // Step 1: Map known tokens (from hardcoded list or memory cache)
  for (const token of tokens) {
    const symbolLower = token.symbol.toLowerCase();
    const addressLower = token.address.toLowerCase();

    if (COMMON_COIN_IDS[symbolLower]) {
      knownIds.push(COMMON_COIN_IDS[symbolLower]);
      contractToIdCache.set(addressLower, COMMON_COIN_IDS[symbolLower]);
      continue;
    }

    if (contractToIdCache.has(addressLower)) {
      knownIds.push(contractToIdCache.get(addressLower)!);
      continue;
    }

    // Ignore Native Zero-Address to prevent unnecessary /contract calls
    if (addressLower === '0x0000000000000000000000000000000000000000') {
      continue;
    }

    unknownTokens.push(token);
  }

  // Step 2: Fallback - Resolve unknown IDs via CoinGecko contract endpoint
  // Run concurrently to speed up network requests
  const fallbackPromises = unknownTokens.map(async (token) => {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${platformId}/contract/${token.address}`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.id) {
        knownIds.push(data.id);
        contractToIdCache.set(token.address.toLowerCase(), data.id); // Cache it!
      }
    } catch (e) {
      console.warn(`[MarketService] Failed to resolve contract ${token.address}`);
    }
  });

  await Promise.allSettled(fallbackPromises);

  // Step 3: Batch fetch price, logo, and metadata from /coins/markets
  if (knownIds.length > 0) {
    // De-duplicate ids to avoid malformed queries
    const uniqueIds = Array.from(new Set(knownIds));
    const idsQuery = uniqueIds.join(',');
    
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${idsQuery}`);
      if (response.ok) {
        const data = await response.json();
        for (const coin of data) {
          marketDataMap[coin.id] = {
            price: coin.current_price || 0,
            image: coin.image || '',
            name: coin.name || '',
            symbol: coin.symbol || ''
          };
        }
      }
    } catch (e) {
      console.warn('[MarketService] Failed to fetch market data', e);
    }
  }

  return marketDataMap;
}

/**
 * Optional Bonus: Trending tokens endpoint.
 * Perfect for a future Discover/Explore screen.
 */
export async function fetchTrendingTokens() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
    if (!response.ok) return [];
    const data = await response.json();
    return data.coins.map((c: any) => ({
      id: c.item.id,
      name: c.item.name,
      symbol: c.item.symbol,
      image: c.item.thumb,
      priceBtc: c.item.price_btc,
    }));
  } catch (e) {
    console.warn('[MarketService] Failed to fetch trending tokens', e);
    return [];
  }
}

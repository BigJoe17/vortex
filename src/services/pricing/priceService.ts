/**
 * Production Wallet Price Service
 */

interface PriceCacheEntry {
  price: number
  timestamp: number
}

const priceCache: Record<string, PriceCacheEntry> = {}

const CACHE_TTL_MS = 120000

export async function fetchTokenPrices(
  contracts: string[],
  network: 'ethereum' | 'polygon'
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

    const platformId = network === 'polygon' ? 'polygon-pos' : 'ethereum';
    const contractQuery = neededContracts.join(',').toLowerCase();

    const url =
      `https://api.coingecko.com/api/v3/simple/token_price/${platformId}` +
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

export async function fetchNativeTokenPrice(network: 'ethereum' | 'polygon'): Promise<number> {
  const coinId = network === 'polygon' ? 'matic-network' : 'ethereum';
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
  try {
    const response = await fetch(url);
    if (!response.ok) return 0;
    const data = await response.json();
    return data[coinId]?.usd ?? 0;
  } catch (e) {
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
import { fetchWalletBalances, resetProvider } from '../blockchain/blockchainService';
import { fetchTokens } from '../token/tokenService';
import { fetchMarketData, getResolvedCoinId } from './marketService';
import type { TokenWithUsd } from '../../store/tokenStore';
import type { NetworkId } from '../../store/walletStore';

type MarketNetwork = 'ethereum' | 'polygon';

/**
 * Map any NetworkId to the CoinGecko-compatible market network.
 * Testnets map to their mainnet equivalents for pricing purposes.
 */
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

/**
 * Orchestrator service to fetch both on-chain balances and off-chain market data.
 */
export async function getEnrichedWalletData(
  address: string,
  network: NetworkId
): Promise<TokenWithUsd[]> {
  const marketNetwork = toMarketNetwork(network);

  let nativeBalances;

  try {
    // Load the native balance first so the dashboard can fail loudly if RPC is unavailable.
    nativeBalances = await fetchWalletBalances(address, network);
  } catch {
    resetProvider(network);
    throw new Error('Unable to load balances. Check your connection and try again.');
  }

  // ERC-20 discovery is best-effort; tokenService degrades to [] on API failures.
  const erc20Tokens = await fetchTokens(address, network);

  const allTokens = [...nativeBalances, ...erc20Tokens];

  // 2. Map queries for MarketData
  const tokenQueries = allTokens.map((t) => ({
    symbol: t.symbol,
    address: 'address' in t ? t.address : '0x0000000000000000000000000000000000000000',
  }));

  // 3. Fetch Market Data (Batch CoinGecko Call)
  const marketData = await fetchMarketData(tokenQueries, marketNetwork);

  // 4. Enrich and Merge Data
  const enrichedTokens: TokenWithUsd[] = allTokens.map((t) => {
    const contractAddress = 'address' in t ? t.address : '0x0000000000000000000000000000000000000000';
    const coinId = getResolvedCoinId(contractAddress, t.symbol);
    const mData = coinId ? marketData[coinId] : undefined;

    const price = mData?.price || 0;
    const balanceNum = parseFloat(t.balanceFormatted || '0');
    const balanceUsd = (balanceNum * price).toFixed(2);

    return {
      ...t,
      address: contractAddress,
      balanceUsd,
      logo: mData?.image || undefined,
      name: mData?.name || t.name,
      symbol: mData?.symbol?.toUpperCase() || t.symbol.toUpperCase(),
    };
  });

  return enrichedTokens;
}

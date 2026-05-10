import { fetchWalletBalances } from '../blockchain/blockchainService';
import { fetchTokens } from '../token/tokenService';
import { fetchMarketData, getResolvedCoinId } from './marketService';
import type { TokenWithUsd } from '../../store/tokenStore';

/**
 * Orchestrator service to fetch both on-chain balances and off-chain market data.
 */
export async function getEnrichedWalletData(
  address: string,
  network: 'ethereum' | 'polygon'
): Promise<TokenWithUsd[]> {
  // 1. Parallel fetch on-chain balances
  const [nativeBalances, erc20Tokens] = await Promise.all([
    fetchWalletBalances(address, network),
    fetchTokens(address, network),
  ]);

  const allTokens = [...nativeBalances, ...erc20Tokens];

  // 2. Map queries for MarketData
  const tokenQueries = allTokens.map((t) => ({
    symbol: t.symbol,
    address: 'address' in t ? t.address : '0x0000000000000000000000000000000000000000',
  }));

  // 3. Fetch Market Data (Batch CoinGecko Call)
  const marketData = await fetchMarketData(tokenQueries, network);

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

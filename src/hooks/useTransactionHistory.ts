/**
 * useTransactionHistory
 *
 * React Query hook for fetching on-chain transaction history.
 * Merges with local pending transactions for a unified view.
 */

import {useQuery} from '@tanstack/react-query';
import {useWalletStore} from '@store/walletStore';
import {useTransactionStore} from '@store/transactionStore';
import {fetchTransactionHistory} from '@services/transaction/historyService';
import {NATIVE_TOKEN_ADDRESS} from '@shared/utils/constants';

export interface MergedTransaction {
  hash: string;
  from: string;
  to: string;
  valueFormatted: string;
  symbol: string;
  tokenAddress?: string;
  direction: 'in' | 'out';
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  category: 'external' | 'erc20' | 'internal' | 'local';
}

export function useTransactionHistory() {
  const address = useWalletStore((s) => s.address);
  const network = useWalletStore((s) => s.network);
  const pendingTransactions = useTransactionStore((s) => s.pendingTransactions);
  const localTransactions = useTransactionStore((s) => s.transactions);

  const {
    data: onChainHistory = [],
    isLoading,
    isError,
    refetch,
    error,
  } = useQuery({
    queryKey: ['txHistory', address, network],
    queryFn: () => fetchTransactionHistory(address!, network, 30),
    enabled: !!address,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: 2,
  });

  // Merge pending local transactions with on-chain history
  const pendingMerged: MergedTransaction[] = pendingTransactions.map((tx) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    valueFormatted: tx.valueFormatted,
    symbol: tx.tokenSymbol,
    tokenAddress: tx.tokenAddress,
    direction: 'out' as const,
    timestamp: tx.timestamp,
    status: 'pending' as const,
    category: 'local' as const,
  }));

  const historyMerged: MergedTransaction[] = onChainHistory.map((tx) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    valueFormatted: tx.valueFormatted,
    symbol: tx.symbol,
    tokenAddress: tx.tokenAddress,
    direction: tx.direction,
    timestamp: tx.timestamp,
    status: 'confirmed' as const,
    category: tx.category,
  }));

  const localMerged: MergedTransaction[] = localTransactions.map((tx) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    valueFormatted: tx.valueFormatted,
    symbol: tx.tokenSymbol,
    tokenAddress: tx.tokenAddress,
    direction: 'out' as const,
    timestamp: tx.timestamp,
    status: tx.status,
    category: tx.tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS
      ? 'local' as const
      : 'erc20' as const,
  }));

  // Filter out on-chain txs already represented locally.
  const localHashes = new Set([
    ...pendingTransactions.map((t) => t.hash),
    ...localTransactions.map((t) => t.hash),
  ]);
  const dedupedHistory = historyMerged.filter(
    (tx) => !localHashes.has(tx.hash),
  );

  // Pending first, then recent local confirmations, then confirmed on-chain history.
  const transactions: MergedTransaction[] = [
    ...pendingMerged,
    ...localMerged,
    ...dedupedHistory,
  ].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return b.timestamp - a.timestamp;
  });

  return {
    transactions,
    isLoading,
    isError,
    error,
    refetch,
    isEmpty: transactions.length === 0 && !isLoading,
  };
}

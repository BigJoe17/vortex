/**
 * Transaction History Service
 *
 * Fetches on-chain transaction history using Alchemy's Asset Transfers API.
 * Normalizes incoming + outgoing transfers into a unified format.
 */

import {getProvider} from '@services/blockchain/blockchainService';
import type {NetworkId} from '@store/walletStore';

export interface TransactionHistoryItem {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueFormatted: string;
  symbol: string;
  asset: string;
  tokenAddress?: string;
  direction: 'in' | 'out';
  timestamp: number;
  blockNum: string;
  category: 'external' | 'erc20' | 'internal';
}

interface AlchemyTransfer {
  hash: string;
  from: string;
  to: string;
  value: number | null;
  asset: string | null;
  category: string;
  blockNum: string;
  metadata: {
    blockTimestamp: string;
  };
  rawContract?: {
    address?: string | null;
  };
}

interface AlchemyTransfersResponse {
  transfers: AlchemyTransfer[];
}

/**
 * Fetch transaction history for a wallet address.
 * Merges incoming + outgoing, sorted newest first.
 */
export async function fetchTransactionHistory(
  address: string,
  network: NetworkId,
  maxCount = 25,
): Promise<TransactionHistoryItem[]> {
  const provider = getProvider(network);

  const [outgoing, incoming] = await Promise.all([
    provider.send('alchemy_getAssetTransfers', [{
      fromBlock: '0x0',
      toBlock: 'latest',
      fromAddress: address,
      category: ['external', 'erc20'],
      order: 'desc',
      maxCount: toHex(maxCount),
      withMetadata: true,
    }]),
    provider.send('alchemy_getAssetTransfers', [{
      fromBlock: '0x0',
      toBlock: 'latest',
      toAddress: address,
      category: ['external', 'erc20'],
      order: 'desc',
      maxCount: toHex(maxCount),
      withMetadata: true,
    }]),
  ]);

  const outTransfers = normalizeTransfers(
    (outgoing as AlchemyTransfersResponse).transfers,
    'out',
  );
  const inTransfers = normalizeTransfers(
    (incoming as AlchemyTransfersResponse).transfers,
    'in',
  );

  const merged = [...outTransfers, ...inTransfers];

  // De-duplicate by hash+direction (same tx can appear in both if self-transfer)
  const seen = new Set<string>();
  const deduped = merged.filter((tx) => {
    const key = `${tx.hash}-${tx.direction}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort newest first
  deduped.sort((a, b) => b.timestamp - a.timestamp);

  return deduped.slice(0, maxCount);
}

function normalizeTransfers(
  transfers: AlchemyTransfer[],
  direction: 'in' | 'out',
): TransactionHistoryItem[] {
  return transfers
    .filter((t) => t.value !== null && t.value > 0)
    .map((t) => {
      const value = t.value ?? 0;
      const formatted = formatTransferValue(value);

      return {
        hash: t.hash,
        from: t.from,
        to: t.to,
        value: value.toString(),
        valueFormatted: formatted,
        symbol: t.asset?.toUpperCase() || 'UNKNOWN',
        asset: t.asset || 'unknown',
        tokenAddress: t.rawContract?.address ?? undefined,
        direction,
        timestamp: new Date(t.metadata.blockTimestamp).getTime(),
        blockNum: t.blockNum,
        category: t.category as 'external' | 'erc20' | 'internal',
      };
    });
}

function formatTransferValue(value: number): string {
  if (value === 0) return '0';
  if (value < 0.0001) return '< 0.0001';
  if (value < 1) return value.toFixed(4);
  if (value < 1000) return value.toFixed(2);
  return value.toLocaleString('en-US', {maximumFractionDigits: 2});
}

function toHex(num: number): string {
  return '0x' + num.toString(16);
}

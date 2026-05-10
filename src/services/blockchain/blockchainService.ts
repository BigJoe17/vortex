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
import {getAlchemyApiKey} from '@shared/utils/env';
import type {NetworkId, TokenBalance} from '@store/walletStore';

// Cached provider instances (one per network)
const providers: Partial<Record<NetworkId, ethers.JsonRpcProvider>> = {};

const ERC20_TRANSFER_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
] as const;

const ERC20_BALANCE_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
] as const;

const ERC20_INTERFACE = new ethers.Interface([
  ...ERC20_TRANSFER_ABI,
  ...ERC20_BALANCE_ABI,
]);

const RPC_TIMEOUT_MS = 20_000;
const CONFIRMATION_TIMEOUT_MS = 120_000;

export interface SendTokenParams {
  tokenAddress: string;
  recipient: string;
  amount: string;
  privateKey: string;
  rpcUrl: string;
}

export interface EstimateERC20TransferGasParams {
  tokenAddress: string;
  recipient: string;
  amount: string;
  senderAddress: string;
  rpcUrl: string;
}

export interface ERC20GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  totalFee: bigint;
  totalFeeFormatted: string;
  decimals: number;
  symbol: string;
  amountWei: string;
}

export interface ERC20TransferResult {
  hash: string;
  from: string;
  to: string;
  tokenAddress: string;
  amount: string;
  amountWei: string;
  symbol: string;
  decimals: number;
  status: 'confirmed';
  blockNumber: number;
  gasUsed: string;
  gasLimit: string;
  gasPriceWei: string;
  networkFeeWei: string;
  networkFeeFormatted: string;
}

export interface ERC20TransferPayload {
  tokenAddress: string;
  recipient: string;
  amountWei: string;
  data: string;
}

export function calculateNetworkFee(gasLimit: bigint, gasPrice: bigint): bigint {
  return gasLimit * gasPrice;
}

/**
 * Get a cached JSON RPC provider for the given network.
 */
export function getProvider(network: NetworkId): ethers.JsonRpcProvider {
  if (providers[network]) {
    
    return providers[network]!;
  }

  const config = CHAIN_CONFIG[network];
  const url = getRpcUrl(network);

  const provider = new ethers.JsonRpcProvider(url, {
    chainId: config.chainId,
    name: config.name,
  });

  providers[network] = provider;
  return provider;
}

/**
 * Build the concrete RPC URL for a network.
 */
export function getRpcUrl(network: NetworkId): string {
  const config = CHAIN_CONFIG[network];
  return network === 'localhost' ? config.rpcUrl : `${config.rpcUrl}/${getAlchemyApiKey()}`;
}

/**
 * Estimate gas for an ERC-20 transfer from a known sender address.
 */
export async function estimateERC20TransferGas(
  params: EstimateERC20TransferGasParams,
): Promise<ERC20GasEstimate> {
  const provider = new ethers.JsonRpcProvider(params.rpcUrl);

  try {
    const prepared = await prepareERC20Transfer(provider, params, params.senderAddress);

    return {
      gasLimit: prepared.gasLimit,
      gasPrice: prepared.gasPrice,
      totalFee: prepared.totalFee,
      totalFeeFormatted: prepared.totalFeeFormatted,
      decimals: prepared.decimals,
      symbol: prepared.symbol,
      amountWei: prepared.amountWei.toString(),
    };
  } catch (error) {
    throw toUserFriendlyBlockchainError(error, 'Token transfer gas estimation failed');
  } finally {
    provider.destroy();
  }
}

/**
 * Send an ERC-20 transfer and wait for one confirmation.
 *
 * SECURITY: The decrypted private key is received only as a function argument,
 * scoped to signer creation, and never stored or logged.
 */
export async function sendERC20Token(
  params: SendTokenParams,
): Promise<ERC20TransferResult> {
  const provider = new ethers.JsonRpcProvider(params.rpcUrl);

  try {
    if (!params.privateKey) {
      throw new Error('Private key required. Decrypt with PIN before signing.');
    }

    const signer = new ethers.Wallet(params.privateKey, provider);
    const fromAddress = signer.address;
    const prepared = await prepareERC20Transfer(provider, params, fromAddress);

    const tx = await withTimeout(
      signer.sendTransaction({
        to: prepared.tokenAddress,
        data: prepared.data,
        gasLimit: prepared.gasLimit,
        maxFeePerGas: prepared.maxFeePerGas,
        maxPriorityFeePerGas: prepared.maxPriorityFeePerGas,
      }),
      RPC_TIMEOUT_MS,
      'RPC timeout while broadcasting transaction. Please try again.',
    );

    const receipt = await provider.waitForTransaction(
      tx.hash,
      1,
      CONFIRMATION_TIMEOUT_MS,
    );

    if (!receipt) {
      throw new Error('RPC timeout while waiting for confirmation. The transaction may still be pending.');
    }

    if (receipt.status !== 1) {
      throw new Error('Token transfer failed on-chain. Please try again.');
    }

    return {
      hash: tx.hash,
      from: fromAddress,
      to: prepared.recipient,
      tokenAddress: prepared.tokenAddress,
      amount: params.amount,
      amountWei: prepared.amountWei.toString(),
      symbol: prepared.symbol,
      decimals: prepared.decimals,
      status: 'confirmed',
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      gasLimit: prepared.gasLimit.toString(),
      gasPriceWei: prepared.gasPrice.toString(),
      networkFeeWei: prepared.totalFee.toString(),
      networkFeeFormatted: prepared.totalFeeFormatted,
    };
  } catch (error) {
    throw toUserFriendlyBlockchainError(error, 'Token transfer failed');
  } finally {
    provider.destroy();
  }
}

interface PreparedERC20Transfer {
  tokenAddress: string;
  recipient: string;
  data: string;
  decimals: number;
  symbol: string;
  amountWei: bigint;
  gasLimit: bigint;
  gasPrice: bigint;
  totalFee: bigint;
  totalFeeFormatted: string;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

async function prepareERC20Transfer(
  provider: ethers.JsonRpcProvider,
  params: Pick<SendTokenParams, 'tokenAddress' | 'recipient' | 'amount'>,
  senderAddress: string,
): Promise<PreparedERC20Transfer> {
  const tokenAddress = normalizeAddress(params.tokenAddress, 'Token contract');
  const recipient = normalizeAddress(params.recipient, 'Recipient');
  const sender = normalizeAddress(senderAddress, 'Sender');

  const [decimalsRaw, symbolRaw] = await Promise.all([
    readERC20Value<bigint>(provider, tokenAddress, 'decimals'),
    readERC20Value<string>(provider, tokenAddress, 'symbol'),
  ]);
  const decimals = Number(decimalsRaw);
  const symbol = symbolRaw || 'TOKEN';

  const payload = buildERC20TransferPayload({
    tokenAddress,
    recipient,
    amount: params.amount,
    decimals,
  });
  const amountWei = BigInt(payload.amountWei);
  const data = payload.data;

  const [tokenBalance, nativeBalance, feeData] = await Promise.all([
    readERC20Value<bigint>(provider, tokenAddress, 'balanceOf', [sender]),
    provider.getBalance(sender),
    provider.getFeeData(),
  ]);

  if (tokenBalance < amountWei) {
    throw new Error(`Insufficient ${symbol} balance`);
  }

  const gasLimit = await withTimeout(
    provider.estimateGas({
      from: sender,
      to: tokenAddress,
      data,
    }),
    RPC_TIMEOUT_MS,
    'RPC timeout while estimating gas. Please try again.',
  );

  const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n;
  const totalFee = calculateNetworkFee(gasLimit, gasPrice);

  if (nativeBalance < totalFee) {
    throw new Error('Insufficient MATIC for network fee');
  }

  return {
    tokenAddress,
    recipient,
    data,
    decimals,
    symbol,
    amountWei,
    gasLimit,
    gasPrice,
    totalFee,
    totalFeeFormatted: ethers.formatEther(totalFee),
    maxFeePerGas: feeData.maxFeePerGas ?? undefined,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
  };
}

async function readERC20Value<T>(
  provider: ethers.JsonRpcProvider,
  tokenAddress: string,
  functionName: 'decimals' | 'symbol' | 'balanceOf',
  args: readonly unknown[] = [],
): Promise<T> {
  const data = ERC20_INTERFACE.encodeFunctionData(functionName, args);
  const result = await withTimeout(
    provider.call({
      to: tokenAddress,
      data,
    }),
    RPC_TIMEOUT_MS,
    `RPC timeout while reading token ${functionName}. Please try again.`,
  );
  const decoded = ERC20_INTERFACE.decodeFunctionResult(functionName, result);
  return decoded[0] as T;
}

export function buildERC20TransferPayload(params: {
  tokenAddress: string;
  recipient: string;
  amount: string;
  decimals: number;
}): ERC20TransferPayload {
  const tokenAddress = normalizeAddress(params.tokenAddress, 'Token contract');
  const recipient = normalizeAddress(params.recipient, 'Recipient');
  const amountWei = parseTokenUnits(params.amount, params.decimals);
  const data = ERC20_INTERFACE.encodeFunctionData('transfer', [
    recipient,
    amountWei,
  ]);

  return {
    tokenAddress,
    recipient,
    amountWei: amountWei.toString(),
    data,
  };
}

export function parseTokenUnits(amount: string, decimals: number): bigint {
  const normalized = amount.trim();

  if (!/^(?:\d+|\d*\.\d+)$/.test(normalized) || Number(normalized) <= 0) {
    throw new Error('Enter a valid amount');
  }

  try {
    return ethers.parseUnits(normalized, decimals);
  } catch {
    throw new Error(`Amount exceeds ${decimals} token decimals`);
  }
}

function normalizeAddress(address: string, label: string): string {
  if (!ethers.isAddress(address)) {
    throw new Error(`${label} address is invalid`);
  }

  return ethers.getAddress(address);
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function toUserFriendlyBlockchainError(error: unknown, fallback: string): Error {
  const message = error instanceof Error ? error.message : fallback;
  const lowerMessage = message.toLowerCase();
  const code = getErrorCode(error);

  if (
    message.startsWith('Insufficient ') ||
    message.startsWith('Invalid ') ||
    message.startsWith('Recipient ') ||
    message.startsWith('Token contract ') ||
    message.startsWith('Sender ') ||
    message.startsWith('Amount ') ||
    message === 'Enter a valid amount' ||
    message.startsWith('RPC timeout')
  ) {
    return new Error(message);
  }

  if (code === 'ACTION_REJECTED' || lowerMessage.includes('user rejected')) {
    return new Error('Transaction was rejected.');
  }

  if (lowerMessage.includes('timeout')) {
    return new Error('RPC timeout. Please try again.');
  }

  if (lowerMessage.includes('insufficient funds')) {
    return new Error('Insufficient MATIC for network fee');
  }

  if (
    lowerMessage.includes('transfer amount exceeds balance') ||
    lowerMessage.includes('erc20insufficientbalance')
  ) {
    return new Error('Insufficient token balance');
  }

  if (
    lowerMessage.includes('execution reverted') ||
    lowerMessage.includes('call exception')
  ) {
    return new Error('Token transfer was rejected by the token contract.');
  }

  return new Error(message || fallback);
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  const code = (error as {code?: unknown}).code;
  return typeof code === 'string' ? code : undefined;
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
}

export function resetProvider(network: NetworkId): void {
  providers[network]?.destroy();
  delete providers[network];
}

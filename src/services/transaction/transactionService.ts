/**
 * Transaction Service
 *
 * Handles building, signing, and sending native token transactions.
 * Uses ethers.js with the provider from blockchainService.
 *
 * SECURITY: Private keys are read from secure storage, used for
 * signing, then immediately discarded. Never logged.
 */

import { ethers } from 'ethers'
import { getProvider } from '@services/blockchain/blockchainService'
import { secureStorage } from '@services/storage/secureStorage'
import type { NetworkId } from '@store/walletStore'

export interface GasEstimate {
  gasLimit: bigint
  gasPrice: bigint
  totalFee: bigint
  totalFeeFormatted: string
}

export interface SendResult {
  hash: string
  from: string
  to: string
  amount: string
}

/**
 * Validate an Ethereum address.
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address)
}

/**
 * Estimate gas for a native token transfer.
 */
export async function estimateGasFee(
  to: string,
  amountEther: string,
  network: NetworkId,
): Promise<GasEstimate> {

  if (!isValidAddress(to)) {
    throw new Error('Invalid recipient address')
  }

  const provider = getProvider(network)

  const value = ethers.parseEther(amountEther)

  const tx = {
    to,
    value,
  }

  const [gasLimit, feeData] = await Promise.all([
    provider.estimateGas(tx),
    provider.getFeeData(),
  ])

  const gasPrice =
    feeData.maxFeePerGas ??
    feeData.gasPrice ??
    0n

  const totalFee = gasLimit * gasPrice

  return {
    gasLimit,
    gasPrice,
    totalFee,
    totalFeeFormatted: ethers.formatEther(totalFee),
  }
}

/**
 * Send a native token (ETH/MATIC/POL) transaction.
 *
 * 1. Reads private key from secure storage
 * 2. Creates an ethers.Wallet signer
 * 3. Validates balance
 * 4. Sends the signed transaction
 * 5. Returns transaction hash
 */
export async function sendNativeTransaction(
  to: string,
  amountEther: string,
  network: NetworkId,
): Promise<SendResult> {

  if (!isValidAddress(to)) {
    throw new Error('Invalid recipient address')
  }

  // Retrieve wallet
  const wallet = await secureStorage.getWallet()

  if (!wallet) {
    throw new Error('No wallet found. Please import a wallet first.')
  }

  const provider = getProvider(network)

  const signer = new ethers.Wallet(wallet.privateKey, provider)

  const amountWei = ethers.parseEther(amountEther)

  // Check balance
  const balance = await provider.getBalance(signer.address)

  if (balance < amountWei) {
    throw new Error('Insufficient balance')
  }

  const feeData = await provider.getFeeData()

  const txRequest = {
    to,
    value: amountWei,
    maxFeePerGas: feeData.maxFeePerGas ?? undefined,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
  }

  // Timeout protection
  const tx = await Promise.race([
    signer.sendTransaction(txRequest),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Transaction timeout')), 20000),
    ),
  ])

  return {
    hash: tx.hash,
    from: signer.address,
    to,
    amount: amountEther,
  }
}

/**
 * Wait for a transaction to be mined.
 */
export async function waitForConfirmation(
  hash: string,
  network: NetworkId,
): Promise<{
  status: 'confirmed' | 'failed'
  blockNumber: number
  gasUsed: string
}> {

  const provider = getProvider(network)

  const receipt = await provider.waitForTransaction(
    hash,
    1,
    120_000,
  )

  if (!receipt) {
    return {
      status: 'failed',
      blockNumber: 0,
      gasUsed: '0',
    }
  }

  return {
    status: receipt.status === 1 ? 'confirmed' : 'failed',
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
  }
}
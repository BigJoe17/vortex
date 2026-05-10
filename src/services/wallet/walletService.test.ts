import {ethers} from 'ethers';
import {
  createWallet,
  importFromPrivateKey,
  importFromSeedPhrase,
} from './walletService';

const HARDHAT_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const HARDHAT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const HARDHAT_MNEMONIC =
  'test test test test test test test test test test test junk';

describe('walletService', () => {
  it('generates a wallet with a valid mnemonic and address', () => {
    const wallet = createWallet();

    expect(ethers.isAddress(wallet.address)).toBe(true);
    expect(wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(wallet.mnemonic?.split(' ')).toHaveLength(12);
  });

  it('imports a private key and derives the expected address', () => {
    const wallet = importFromPrivateKey(HARDHAT_PRIVATE_KEY);

    expect(wallet.address).toBe(HARDHAT_ADDRESS);
    expect(wallet.privateKey).toBe(HARDHAT_PRIVATE_KEY);
  });

  it('imports a mnemonic and derives the expected address', () => {
    const wallet = importFromSeedPhrase(HARDHAT_MNEMONIC);

    expect(wallet.address).toBe(HARDHAT_ADDRESS);
  });
});

import {ethers} from 'ethers';
import {
  buildERC20TransferPayload,
  calculateNetworkFee,
  parseTokenUnits,
} from './blockchainService';

const TOKEN_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const RECIPIENT = '0x000000000000000000000000000000000000dEaD';

describe('blockchainService ERC-20 helpers', () => {
  it('converts USDC/USDT style 6-decimal amounts', () => {
    expect(parseTokenUnits('1.23', 6).toString()).toBe('1230000');
    expect(parseTokenUnits('0.000001', 6).toString()).toBe('1');
  });

  it('converts WETH/DAI style 18-decimal amounts', () => {
    expect(parseTokenUnits('1.5', 18).toString()).toBe(
      '1500000000000000000',
    );
  });

  it('rejects amounts that exceed token decimals', () => {
    expect(() => parseTokenUnits('0.0000001', 6)).toThrow(
      'Amount exceeds 6 token decimals',
    );
  });

  it('generates a standard ERC-20 transfer payload', () => {
    const payload = buildERC20TransferPayload({
      tokenAddress: TOKEN_ADDRESS,
      recipient: RECIPIENT,
      amount: '2.5',
      decimals: 6,
    });
    const erc20Interface = new ethers.Interface([
      'function transfer(address to, uint256 amount) returns (bool)',
    ]);
    const decoded = erc20Interface.decodeFunctionData(
      'transfer',
      payload.data,
    );

    expect(payload.tokenAddress).toBe(ethers.getAddress(TOKEN_ADDRESS));
    expect(payload.recipient).toBe(ethers.getAddress(RECIPIENT));
    expect(payload.amountWei).toBe('2500000');
    expect(decoded[0]).toBe(ethers.getAddress(RECIPIENT));
    expect(decoded[1]).toBe(2500000n);
  });

  it('calculates network fee from estimated gas limit and gas price', () => {
    expect(calculateNetworkFee(65000n, 30_000_000_000n).toString()).toBe(
      '1950000000000000',
    );
  });
});

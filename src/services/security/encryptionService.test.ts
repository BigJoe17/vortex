import {
  decryptPrivateKey,
  encryptPrivateKey,
} from './encryptionService';

const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

describe('encryptionService', () => {
  it('encrypts and decrypts a private key roundtrip', () => {
    const encrypted = encryptPrivateKey(PRIVATE_KEY, '839271');

    expect(encrypted).not.toBe(PRIVATE_KEY);
    expect(decryptPrivateKey(encrypted, '839271')).toBe(PRIVATE_KEY);
  });

  it('rejects an incorrect PIN', () => {
    const encrypted = encryptPrivateKey(PRIVATE_KEY, '839271');

    expect(() => decryptPrivateKey(encrypted, '111111')).toThrow();
  });

  it('rejects corrupted payloads', () => {
    expect(() => decryptPrivateKey('not-json', '839271')).toThrow(
      'Decryption failed',
    );
  });
});

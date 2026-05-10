# Vortex Wallet

Vortex is a React Native Expo non-custodial wallet MVP focused on Polygon Mainnet. It supports wallet creation/import, encrypted private-key storage, PIN and biometric unlock, native MATIC sends, ERC-20 discovery and sends, CoinGecko pricing, and Alchemy-backed transaction history.

## Requirements

- Node.js 22.11 or newer
- npm
- Expo CLI through `npx expo`
- Android Studio or Xcode for native builds
- An Alchemy API key with Polygon Mainnet access

## Environment

Create a local `.env` from `.env.example`:

```sh
cp .env.example .env
```

Required values:

```sh
EXPO_PUBLIC_ALCHEMY_API_KEY=
EXPO_PUBLIC_COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
EXPO_PUBLIC_SENTRY_DSN=
```

Only `EXPO_PUBLIC_*` variables are read by app code so Expo can inline them into the JavaScript bundle. Never commit `.env` or environment files with real keys.

## Install

```sh
npm install
```

## Development

```sh
npm start
npm run android
npm run ios
```

## Testing

```sh
npm test
npx tsc --noEmit
npm run lint
```

The service tests cover encryption roundtrips, incorrect PIN handling, corrupted encrypted payloads, mnemonic/private-key wallet derivation, ERC-20 unit conversion, transfer payload generation, and network-fee math.

## Release Builds

For a controlled MVP preview build:

```sh
npx expo prebuild
npx expo run:android --variant release
```

If using EAS:

```sh
npx eas build --profile preview --platform android
```

Before distributing a preview APK, verify cold launch, wallet import, receive, native send, ERC-20 send, history refresh, lock/unlock, background/foreground behavior, and airplane-mode recovery on a physical Android device.

## Architecture

- `src/services/wallet`: pure wallet creation/import helpers.
- `src/services/security`: encryption, biometric auth, and session timers.
- `src/services/storage`: SecureStore wrapper for encrypted wallet data.
- `src/services/blockchain`: RPC providers, native balances, ERC-20 transfer helpers.
- `src/services/token`: Alchemy ERC-20 discovery and metadata.
- `src/services/pricing`: CoinGecko market data enrichment.
- `src/services/transaction`: native send and Alchemy history.
- `src/store`: Zustand state for auth, wallet balances, tokens, and transactions.
- `src/screens/wallet`: wallet home, send, and confirmation flows.

## Security Notes

- Private keys are encrypted before storage.
- PINs are stored only as hashes.
- Decrypted private keys are scoped to signing functions and are not stored in Zustand.
- `.env` files are ignored by git.
- Runtime crashes and transaction failures are reported to Sentry only when `EXPO_PUBLIC_SENTRY_DSN` is configured.

## Known MVP Limits

- Polygon Mainnet is the primary supported production network.
- CoinGecko pricing can be delayed or rate limited.
- ERC-20 discovery depends on Alchemy token APIs.
- No in-app seed phrase backup verification after initial setup.
- No swap, fiat onramp, NFT detail, or hardware wallet support in the MVP.

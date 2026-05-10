# MVP Release QA Checklist

Use this checklist before sharing a Vortex preview APK with client demo users or controlled beta testers.

## Physical Android Device

- Cold launch from killed state.
- Create wallet.
- Import wallet from seed phrase.
- Lock session and unlock with PIN.
- Unlock with biometrics when enabled.
- Background app for at least 1 minute, foreground, verify lock behavior.
- Receive screen renders wallet address and QR code.
- Wallet dashboard loads native MATIC balance first.
- ERC-20 tokens load after native balance.
- CoinGecko pricing enriches balances when online.
- Native MATIC send reaches confirmation screen and handles insufficient balance.
- ERC-20 send reaches confirmation screen and handles insufficient token balance.
- Successful send invalidates balances and transaction history.
- Recent Activity shows native and ERC-20 sends.

## Network Failure

- Launch in airplane mode and verify balance error state with Retry.
- Turn network back on and verify Retry reloads balances.
- Trigger slow network and verify loading states do not block navigation.
- Verify RPC timeout shows a user-friendly error in send flow.
- Verify CoinGecko failures do not crash wallet balance rendering.

## Release Build

- Build preview APK.
- Install APK on physical Android device.
- Verify no red screens on launch.
- Verify app icon, splash, and logo assets render.
- Verify Sentry receives a test event when `EXPO_PUBLIC_SENTRY_DSN` is set.
- Verify `.env` values are provided by the build environment, not committed files.

## Commands

```sh
npx tsc --noEmit
npm test -- --runInBand
npm run lint
npm audit --audit-level=high
npx eas build --profile preview --platform android
```

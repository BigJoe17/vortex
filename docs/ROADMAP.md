# Vortex MVP Roadmap

## Completed

- Wallet creation and import.
- PIN encrypted private-key storage.
- Biometric unlock.
- Polygon Mainnet support.
- Native MATIC balance and send.
- ERC-20 token discovery.
- ERC-20 send with dynamic decimals and gas checks.
- CoinGecko pricing.
- Alchemy transaction history.
- React Query cache invalidation after sends.
- Global render error boundary.
- Optional Sentry crash reporting.
- Crypto and transaction unit tests.

## MVP Beta Scope

- Controlled Android preview builds.
- Polygon Mainnet wallet usage.
- Native MATIC and discovered ERC-20 sends.
- Balance, pricing, and recent activity refresh.
- Secure local key storage and session lock.

## Known Limitations

- Pricing depends on CoinGecko availability and rate limits.
- Token discovery and history depend on Alchemy availability.
- Sentry requires `EXPO_PUBLIC_SENTRY_DSN` to be configured.
- No production fiat onramp or swap execution.
- No multi-account wallet management.
- No hardware wallet support.
- No push notifications.
- No formal third-party security audit yet.

## Future Phases

- Add user-controlled RPC fallback providers.
- Add token detail screens with token-specific history filtering.
- Add deeper transaction simulation and risk warnings.
- Add seed backup reminders and recovery education.
- Add EAS CI release pipeline with signed preview builds.
- Add automated device smoke tests for Android release artifacts.
- Add security review and dependency audit remediation.

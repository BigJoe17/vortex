/**
 * Environment helpers for Expo public runtime config.
 *
 * Only EXPO_PUBLIC_* values are read in app code because Expo inlines those
 * variables into the JavaScript bundle.
 */

const DEFAULT_COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export function getAlchemyApiKey(): string {
  const apiKey = process.env.EXPO_PUBLIC_ALCHEMY_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_ALCHEMY_API_KEY');
  }

  return apiKey;
}

export function getCoinGeckoBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_COINGECKO_BASE_URL?.trim() ||
    DEFAULT_COINGECKO_BASE_URL
  ).replace(/\/$/, '');
}

export function getSentryDsn(): string | undefined {
  return process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || undefined;
}

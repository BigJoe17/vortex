/**
 * Error reporting wrapper.
 *
 * Sentry is initialized only when EXPO_PUBLIC_SENTRY_DSN is configured.
 * This keeps local/dev builds functional without a crash-reporting project.
 */

import type React from 'react';
import * as Sentry from '@sentry/react-native';
import {getSentryDsn} from '@shared/utils/env';

let isInitialized = false;

export function initErrorReporting(): void {
  const dsn = getSentryDsn();

  if (!dsn || isInitialized) {
    return;
  }

  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    enableAutoSessionTracking: true,
    tracesSampleRate: __DEV__ ? 0 : 0.2,
  });

  isInitialized = true;
}

export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const normalizedError =
    error instanceof Error ? error : new Error(String(error || 'Unknown error'));

  if (isInitialized) {
    Sentry.captureException(normalizedError, {
      extra: context,
    });
    return;
  }

  if (__DEV__) {
    console.warn('[ErrorReporting]', normalizedError.message, context);
  }
}

export function captureMessage(
  message: string,
  context?: Record<string, unknown>,
): void {
  if (isInitialized) {
    Sentry.captureMessage(message, {
      extra: context,
    });
    return;
  }

  if (__DEV__) {
    console.warn('[ErrorReporting]', message, context);
  }
}

export function wrapWithErrorReporting<P extends object>(
  Component: React.ComponentType<P>,
): React.ComponentType<P> {
  if (!isInitialized) {
    return Component;
  }

  return Sentry.wrap(
    Component as React.ComponentType<Record<string, unknown>>,
  ) as unknown as React.ComponentType<P>;
}

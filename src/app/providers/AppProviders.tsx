/**
 * App Providers
 *
 * Wraps the entire app with required context providers.
 * Order matters: outermost providers are initialized first.
 */

import React, {useEffect, useRef} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StyleSheet, AppState, AppStateStatus} from 'react-native';
import {ThemeProvider} from '@theme';
import {useAuthStore} from '@store/authStore';
import {startSessionTimer, clearSessionTimer} from '@services/security/sessionManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale after 30 seconds — good balance for balance fetching
      staleTime: 30 * 1000,
      // Cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests twice
      retry: 2,
      // Refetch on window focus (when app comes to foreground)
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({children}: AppProvidersProps): React.JSX.Element {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const authStore = useAuthStore.getState();

      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        if (authStore.isAuthenticated && !authStore.isLocked) {
          startSessionTimer();
        }
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to the background
        if (authStore.isAuthenticated) {
          authStore.lock();
          clearSessionTimer();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

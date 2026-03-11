/**
 * App Providers
 *
 * Wraps the entire app with required context providers.
 * Order matters: outermost providers are initialized first.
 */

import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StyleSheet} from 'react-native';

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
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

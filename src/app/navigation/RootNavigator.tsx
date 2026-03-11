/**
 * Root Navigator
 *
 * Switches between Auth and Main stacks based on auth state.
 * On mount, checks secure storage for a saved wallet and restores it.
 */

import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, StyleSheet, Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuthStore} from '@store/authStore';
import {useWalletStore} from '@store/walletStore';
import {secureStorage} from '@services/storage/secureStorage';
import {AuthNavigator} from './AuthNavigator';
import {MainNavigator} from './MainNavigator';
import {colors, typography, spacing} from '@theme';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const login = useAuthStore(state => state.login);
  const initWallet = useWalletStore(state => state.initWallet);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    restoreWallet();
  }, []);

  const restoreWallet = async () => {
    try {
      const wallet = await secureStorage.getWallet();
      if (wallet) {
        // Wallet found in secure storage — restore session
        initWallet(wallet.address);
        login(
          {
            id: 'restored',
            username:
              wallet.address.slice(0, 6) + '...' + wallet.address.slice(-4),
            walletAddress: wallet.address,
            createdAt: new Date().toISOString(),
          },
          'restored-session',
        );
      }
    } catch (error) {
      console.error('[RootNavigator] Failed to restore wallet:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  // Show splash while checking storage
  if (isRestoring) {
    return (
      <View style={splashStyles.container}>
        <Text style={splashStyles.logo}>V</Text>
        <Text style={splashStyles.title}>Vortex</Text>
        <ActivityIndicator
          size="large"
          color={colors.brand.primary}
          style={splashStyles.spinner}
        />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.background.primary},
        animation: 'fade',
      }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.brand.primary,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text.primary,
    marginBottom: spacing['3xl'],
  },
  spinner: {
    marginTop: spacing.xl,
  },
});


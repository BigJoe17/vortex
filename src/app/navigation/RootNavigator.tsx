/**
 * Root Navigator
 *
 * Switches between Auth and Main stacks based on auth state.
 * On mount, checks secure storage for a saved wallet and restores it.
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/authStore';
import { useWalletStore } from '@store/walletStore';
import { secureStorage } from '@services/storage/secureStorage';
import { authenticateUser } from '@services/security/biometricService';
import { resetSessionTimer } from '@services/security/sessionManager';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { LockScreen } from '../../screens/LockScreen';
import { colors, typography, spacing, borderRadius } from '@theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isBiometricEnabled = useAuthStore(state => state.isBiometricEnabled);
  const isLocked = useAuthStore(state => state.isLocked);
  const unlock = useAuthStore(state => state.unlock);

  const login = useAuthStore(state => state.login);
  const initWallet = useWalletStore(state => state.initWallet);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    restoreWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBiometricUnlock = async () => {
    const result = await authenticateUser('Unlock Wallet');
    if (result.success) {
      unlock();
      resetSessionTimer();
    }
  };

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
          // Restored session, pass config flag 'isRestoredSession' = true to lock wallet initially
          'restored-session',
          true
        );
      }
    } catch (error) {
      console.error('[RootNavigator] Failed to restore wallet:', error);
    } finally {
      setIsRestoring(false);

      // Auto-trigger biometric prompt if they are authenticated and locked
      const state = useAuthStore.getState();
      if (state.isAuthenticated && state.isBiometricEnabled && state.isLocked) {
        setTimeout(() => {
          handleBiometricUnlock();
        }, 500);
      }
    }
  };

  // Show splash while checking storage
  if (isRestoring) {
    return (
      <View style={splashStyles.container}>
        <Image
          source={require('../../assets/logo.png')}
          style={splashStyles.logoImage}
          resizeMode="contain"
        />
        <Text style={splashStyles.title}>Vortex</Text>
        <ActivityIndicator
          size="large"
          color={colors.brand.primary}
          style={splashStyles.spinner}
        />
      </View>
    );
  }

  // If the user's session is locked we show the auto-lock gate.
  if (isAuthenticated && isLocked) {
    return <LockScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
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
  logoImage: {
    width: 88,
    height: 88,
    marginBottom: spacing.xl,
  },
  lockLogoImage: {
    width: 80,
    height: 80,
    marginBottom: spacing.xl,
    opacity: 0.9,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  spinner: {
    marginTop: spacing.xl,
  },
  unlockBtnContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing.xl,
  },
  pinInputContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing.xl,
    width: '100%',
  },
  pinDesc: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  pinInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.secondary,
    paddingHorizontal: spacing.lg,
    width: '100%',
    height: 52,
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 8,
    textAlign: 'center',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  unlockAction: {
    ...typography.labelLarge,
    color: colors.background.primary,
    fontWeight: '700',
  },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  bioAction: {
    ...typography.labelLarge,
    color: colors.text.secondary,
    fontWeight: '600',
  },
});
